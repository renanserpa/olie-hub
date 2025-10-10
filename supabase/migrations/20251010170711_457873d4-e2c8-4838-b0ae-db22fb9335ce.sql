-- Add birthdate column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Create index for birthday queries
CREATE INDEX IF NOT EXISTS idx_contacts_birthdate ON contacts(birthdate);

-- Add comment to document address JSONB structure
COMMENT ON COLUMN contacts.address IS 'JSONB structure: {cep, logradouro, numero, complemento, bairro, cidade, estado, pais}';