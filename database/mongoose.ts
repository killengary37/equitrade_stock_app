import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DIRECT_MONGODB_URI = process.env.DIRECT_MONGODB_URI; // Optional non-SRV fallback (e.g., mongodb://host:27017/db)

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    const usingDirect = Boolean(DIRECT_MONGODB_URI);

    const uri = usingDirect ? DIRECT_MONGODB_URI : MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI must be set within .env (or set DIRECT_MONGODB_URI to bypass SRV).');
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const options: mongoose.ConnectOptions = {
            bufferCommands: false,
            serverSelectionTimeoutMS: process.env.NODE_ENV === 'development' ? 8000 : 30000,
            // If DIRECT_MONGODB_URI is provided, we assume a direct connection (non-SRV)
            directConnection: usingDirect || undefined,
        };

        cached.promise = mongoose.connect(uri, options);
    }

    try {
        cached.conn = await cached.promise;
    } catch (err: any) {
        cached.promise = null;

        // Provide clearer diagnostics for SRV/DNS failures
        const code = err?.code || err?.name;
        const msg: string = err?.message || '';
        const looksLikeSrvIssue = msg.includes('querySrv') || msg.includes('ENOTFOUND') || code === 'ENOTFOUND' || code === 'ECONNREFUSED';

        if (!usingDirect && looksLikeSrvIssue) {
            console.error('[MongoDB] DNS SRV lookup appears to have failed for mongodb+srv URI.');
            console.error('Hints:');
            console.error('- Your network/DNS (VPN, firewall, Pi-hole, corporate DNS) may block SRV lookups.');
            console.error('- Try setting DIRECT_MONGODB_URI in .env to a non-SRV connection string and restart dev server.');
            console.error('- Ensure any special characters in your password are URL-encoded.');
        }

        throw err;
    }

    const mode = usingDirect ? 'direct (non-SRV)' : 'SRV';
    console.log(`[MongoDB] Connected in ${mode} mode (${process.env.NODE_ENV}).`);

    return cached.conn;
}