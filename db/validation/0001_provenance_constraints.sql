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
    'Schema validation indication',
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
    'limitation',
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
    publisher,
    access_date,
    metadata_json
  )
  VALUES (
    'manual_source',
    'Schema validation source',
    'https://example.com/evidara/schema-validation-source',
    'EvidaraOS local validation',
    CURRENT_DATE,
    '{"schemaValidation": true, "productEvidence": false}'::jsonb
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
    'Schema validation source. Used only to prove relational provenance constraints.',
    'SCHEMA_VALIDATION_SOURCE',
    'constraint validation field',
    'manual_reviewed',
    'needs_review',
    'Validation-only citation; not biomedical evidence.'
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
    'limitation',
    'Schema validation record proving that evidence_records require citation provenance.',
    'constraint validation field',
    'constraint validation only',
    'not applicable',
    'manual_reviewed',
    'Validation-only evidence record; not biomedical evidence.'
  );

  RAISE NOTICE 'PASS: valid source -> citation -> evidence_record chain succeeded.';
END $$;

ROLLBACK;
