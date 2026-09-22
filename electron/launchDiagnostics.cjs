// Shared by the Electron launcher and its Node process monitor. Never serialize
// whole launch options/errors: they may contain authentication or spawn arguments.
function redact(text, secrets = []) {
    let value = String(text ?? '');
    for (const secret of secrets.filter(item => typeof item === 'string' && item.length > 1)) {
        for (const form of new Set([secret, encodeURIComponent(secret), JSON.stringify(secret).slice(1,-1)])) value = value.split(form).join('[REDACTED]');
    }
    return value
        .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
        .replace(/((?:--)?(?:access[_-]?token|refresh[_-]?token|auth[_-]?session|password|client[_-]?secret|authorization[_-]?code)["']?\s*(?:[=:]\s*|\s+))["']?[^\s,}"']+["']?/gi, '$1[REDACTED]')
        .replace(/([?&](?:code|token|access_token|refresh_token)=)[^&\s]+/gi, '$1[REDACTED]');
}
function describeError(error, secrets = [], depth = 0) {
    if (!error || typeof error !== 'object') return { message: redact(error, secrets) };
    const result = {};
    for (const key of ['name','message','stack','code','syscall']) if (error[key] !== undefined) result[key] = redact(error[key], secrets).slice(0,16000);
    if (error.cause !== undefined && depth < 3) result.cause = describeError(error.cause, secrets, depth+1);
    return result;
}
module.exports = {redact, describeError};
