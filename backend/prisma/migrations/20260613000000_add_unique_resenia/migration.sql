-- Unicidad: un cliente puede dejar como máximo una reseña por cancha
CREATE UNIQUE INDEX IF NOT EXISTS "Resenia_email_cliente_id_cancha_key"
  ON "Resenia"("email_cliente", "id_cancha");
