export async function onRequestPost(context) {
    const { request, env } = context;
    const { token } = await request.json();

    // 1. Verify the Turnstile Token with Cloudflare
    const ip = request.headers.get('CF-Connecting-IP');
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const verifyResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        body: formData,
        method: 'POST',
    });
    const outcome = await verifyResult.json();

    if (!outcome.success) {
        return new Response('Bot detected', { status: 403 });
    }

    // 2. Fetch the encrypted asset from your Pages deployment
    const url = new URL(request.url);
    const encryptedAsset = await fetch(`${url.origin}/product-encrypted.txt`);
    const encryptedText = await encryptedAsset.text();

    // 3. Decrypt the asset at the Edge using Web Crypto API
    // (Uses the DECRYPTION_KEY stored securely in Cloudflare dashboard)
    const decryptedHtml = await decryptData(encryptedText, env.DECRYPTION_KEY);

    // 4. Return the pristine HTML to the browser
    return new Response(decryptedHtml, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Pseudo-helper for Web Crypto AES Decryption
async function decryptData(encryptedText, key) {
    // Standard Web Crypto API AES decryption logic goes here
    return "<h1>Boom! Real Product Revealed</h1>"; 
}