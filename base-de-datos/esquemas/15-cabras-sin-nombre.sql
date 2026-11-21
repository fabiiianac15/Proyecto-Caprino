-- PARCHE 15: cabras sin nombre. Los registros que guardaron "." o "-" como nombre
-- (porque el formulario lo exigía) quedan con nombre vacío: se identifican por la chapeta.
UPDATE ANIMAL SET nombre = NULL WHERE REGEXP_LIKE(TRIM(nombre), '^[.\-_ ]+$');
COMMIT;
