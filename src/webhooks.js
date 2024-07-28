const nacl = require('tweetnacl');

module.exports.isValidSignature = (signature, host, originalUrl, rawBody) => {
    const message = `https://${host}${originalUrl}:${rawBody}`;
    return nacl.sign.detached.verify(
        Buffer.from(message, 'utf8'),
        Buffer.from(signature, 'base64'),
        Buffer.from(process.env.WEBHOOK_SIGNATURE_PUBLIC_KEY, 'base64') // TODOs consider adding it as a constant?
    )
}