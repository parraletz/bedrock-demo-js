import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { defaultProvider } from '@aws-sdk/credential-provider-node'

// Create a new Bedrock Runtime client instance.
const client = new BedrockRuntimeClient({
  credentialDefaultProvider: defaultProvider,
  region: 'us-west-2',
})

// Prepare the payload for the model.
const prompt = 'Tell me a story!'
const payload = {
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 1000,
  messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
}

// Invoke Claude with the payload and wait for the API to respond.
const modelId = 'anthropic.claude-3-haiku-20240307-v1:0'
const command = new InvokeModelWithResponseStreamCommand({
  contentType: 'application/json',
  body: JSON.stringify(payload),
  modelId,
})
const apiResponse = await client.send(command)

// Process and print the stream in real-time
let completeMessage = ''

for await (const item of apiResponse.body) {
  // Decode each chunk
  const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes))

  // Get its type
  const chunk_type = chunk.type

  // Process the chunk depending on its type
  if (chunk_type === 'message_start') {
    // The "message_start" chunk contains the message's role
    console.log(`The message's role: ${chunk.message.role}`)
  } else if (chunk_type === 'content_block_delta') {
    // The "content_block_delta" chunks contain the actual response text

    // Print each individual chunk in real-time
    process.stdout.write(chunk.delta.text)

    // ... and add it to the complete message
    completeMessage = completeMessage + chunk.delta.text
  } else if (chunk_type === 'message_stop') {
    // The "message_stop" chunk contains some metrics
    const metrics = chunk['amazon-bedrock-invocationMetrics']
    console.log(`\nNumber of input tokens: ${metrics.inputTokenCount}`)
    console.log(`Number of output tokens: ${metrics.outputTokenCount}`)
    console.log(`Invocation latency: ${metrics.invocationLatency}`)
    console.log(`First byte latency: ${metrics.firstByteLatency}`)
  }
}

// Print the complete message.
console.log('\nComplete response:')
console.log(completeMessage)
