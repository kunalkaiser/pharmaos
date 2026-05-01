-- Validation checks for the Phase 2 provenance schema.
-- Run only against a disposable/local database. The script opens a transaction
-- and rolls it back so no validation rows remain.

BEGIN;

DO $$
DECLARE
  source_id UUID;
  citation_id UUID;
  packet_id UUID;
BEGIN
  -- A citation must not be creatable without an evidence source.
  BEGIN
    INSERT INTO citations (
      evidence_source_id,
      citation_text,
      source_identifier
    )
    VALUES (
      gen_random_uuid(),
      'Invalid citation without source',
      'INVALID:SOURCE'
    );
    RAISE EXCEPTION 'Expected foreign key violation for citation without evidence_source.';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'PASS: citation without evidence_source was rejected.';
  END;

  -- An evidence record must not be creatable without a citation.
  INSERT INTO evidence_packets (
    title,
    disease_or_indication,
    intended_use,
    status
  )
  VALUES (
    'Validation packet',
    'Obstructive sleep apnea',
    'schema_validation',
    'draft'
  )
  RETURNING id INTO packet_id;

  BEGIN
    INSERT INTO evidence_records (
      evidence_packet_id,
      citation_id,
      record_type,
      claim_text
    )
    VALUES (
      packet_id,
      gen_random_uuid(),
      'prevalence',
      'Invalid evidence record without citation'
    );
    RAISE EXCEPTION 'Expected foreign key violation for evidence_record without citation.';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'PASS: evidence_record without citation was rejected.';
  END;

  -- Valid source -> citation -> evidence_record creation should succeed.
  INSERT INTO evidence_sources (
    source_type,
    title,
    url,
    pmid,
    doi,
    publisher,
    publication_date,
    access_date,
    metadata_json
  )
  VALUES (
    'pubmed',
    'Prevalence of obstructive sleep apnea in the general population: A systematic review',
    'https://pubmed.ncbi.nlm.nih.gov/27568340/',
    '27568340',
    '10.1016/j.smrv.2016.07.002',
    'Sleep Medicine Reviews',
    DATE '2017-08-01',
    CURRENT_DATE,
    '{"validation": true, "liveRetrieval": false}'::jsonb
  )
  RETURNING id INTO source_id;

  INSERT INTO citations (
    evidence_source_id,
    citation_text,
    source_identifier,
    extracted_field,
    extraction_confidence,
    human_review_status,
    limitation_notes
  )
  VALUES (
    source_id,
    'Senaratna CV, et al. Sleep Med Rev. 2017;34:70-81. PMID: 27568340.',
    'PMID:27568340',
    'adult OSA prevalence range by AHI threshold',
    'manual_reviewed',
    'needs_review',
    'Validation-only citation; not live retrieval.'
  )
  RETURNING id INTO citation_id;

  INSERT INTO evidence_records (
    evidence_packet_id,
    citation_id,
    record_type,
    claim_text,
    extracted_field,
    value_text,
    unit,
    confidence_label,
    limitation_notes
  )
  VALUES (
    packet_id,
    citation_id,
    'prevalence',
    'A systematic review reported adult OSA prevalence ranges that vary by AHI threshold and study population.',
    'prevalence range',
    '9% to 38% at AHI >=5; 6% to 17% at AHI >=15',
    'percent of adult population in included studies',
    'manual_reviewed',
    'Validation-only evidence record; not live retrieval.'
  );

  RAISE NOTICE 'PASS: valid source -> citation -> evidence_record chain succeeded.';
END $$;

ROLLBACK;
