import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * AWS Secrets Manager Client
 * Retrieves OpenAI API key from Secrets Manager
 */

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Cache for API key (to avoid repeated Secrets Manager calls)
let cachedApiKey: string | null = null;

/**
 * Get OpenAI API key from AWS Secrets Manager
 * @param secretName - Name of secret in Secrets Manager
 * @returns OpenAI API key
 * @throws Error if secret not found or invalid
 */
export async function getOpenAIApiKey(secretName: string): Promise<string> {
  // Return cached key if available
  if (cachedApiKey) {
    return cachedApiKey as string;
  }

  try {
    console.log(`Retrieving secret: ${secretName}`);
    
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });
    
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    // Parse JSON secret
    const secret = JSON.parse(response.SecretString);
    
    if (!secret.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in secret');
    }

    // Cache the key
    cachedApiKey = secret.OPENAI_API_KEY;
    
    console.log('Successfully retrieved OpenAI API key');
    return secret.OPENAI_API_KEY;
  } catch (error: any) {
    console.error('Failed to retrieve secret:', error.message);
    throw new Error(`Failed to retrieve API key from Secrets Manager: ${error.message}`);
  }
}


