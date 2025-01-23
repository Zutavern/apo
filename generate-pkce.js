const array = new Uint8Array(32);
crypto.getRandomValues(array);
const codeVerifier = Buffer.from(array).toString('base64url').substring(0, 43);
console.log('Code Verifier:', codeVerifier);

const encoder = new TextEncoder();
const data = encoder.encode(codeVerifier);
crypto.subtle.digest('SHA-256', data).then(hash => {
  const codeChallenge = Buffer.from(hash).toString('base64url');
  console.log('Code Challenge:', codeChallenge);
}); 