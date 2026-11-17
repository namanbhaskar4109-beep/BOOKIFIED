import mongoose from "mongoose";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

/**
 * Resolves mongodb+srv:// URIs using DNS-over-HTTPS (DoH) over port 443.
 * This completely avoids querySrv ECONNREFUSED errors caused by local routers
 * or ISPs blocking UDP port 53 DNS SRV queries on Windows.
 */
async function resolveMongoSrvViaDoH(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  try {
    const match = uri.match(/^mongodb\+srv:\/\/([^@]+@)?([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) return uri;

    const auth = match[1] || "";
    const host = match[2];
    const path = match[3] || "/";
    const search = match[4] || "";

    const srvName = `_mongodb._tcp.${host}`;
    let shardHosts: string[] = [];

    // 1. Try Google DNS over HTTPS (Port 443)
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(srvName)}&type=SRV`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.Answer)) {
          for (const ans of json.Answer) {
            if (typeof ans.data === "string") {
              const parts = ans.data.trim().split(/\s+/);
              if (parts.length >= 4) {
                shardHosts.push(`${parts[3].replace(/\.$/, "")}:${parts[2]}`);
              }
            }
          }
        }
      }
    } catch {
      // Fallback to Cloudflare DoH below
    }

    // 2. Fallback to Cloudflare DNS over HTTPS if Google DoH failed
    if (shardHosts.length === 0) {
      try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(srvName)}&type=SRV`, {
          headers: { Accept: "application/dns-json" },
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.Answer)) {
            for (const ans of json.Answer) {
              if (typeof ans.data === "string") {
                const parts = ans.data.trim().split(/\s+/);
                if (parts.length >= 4) {
                  shardHosts.push(`${parts[3].replace(/\.$/, "")}:${parts[2]}`);
                }
              }
            }
          }
        }
      } catch {
        // Fallback to standard Atlas shard naming below
      }
    }

    // 3. Fallback: Standard MongoDB Atlas 3-shard convention if DoH blocked
    if (shardHosts.length === 0) {
      const dotIndex = host.indexOf(".");
      if (dotIndex !== -1) {
        const clusterPrefix = host.substring(0, dotIndex);
        const domainSuffix = host.substring(dotIndex + 1);
        shardHosts = [
          `${clusterPrefix}-shard-00-00.${domainSuffix}:27017`,
          `${clusterPrefix}-shard-00-01.${domainSuffix}:27017`,
          `${clusterPrefix}-shard-00-02.${domainSuffix}:27017`,
        ];
      }
    }

    if (shardHosts.length === 0) return uri;

    // Build standard query parameters
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (!params.has("ssl") && !params.has("tls")) {
      params.set("ssl", "true");
    }
    if (!params.has("authSource")) {
      params.set("authSource", "admin");
    }
    if (!params.has("retryWrites")) {
      params.set("retryWrites", "true");
    }

    const standardUri = `mongodb://${auth}${shardHosts.join(",")}${path}?${params.toString()}`;
    return standardUri;
  } catch (err) {
    console.warn("DoH SRV fallback error:", err);
    return uri;
  }
}

async function connectWithRetry(uri: string) {
  try {
    return await mongoose.connect(uri, {
      dbName: "bookefy",
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (err: any) {
    const isSrvError =
      err?.code === "ECONNREFUSED" ||
      err?.syscall === "querySrv" ||
      err?.message?.includes("querySrv") ||
      err?.message?.includes("ECONNREFUSED");

    if (isSrvError && uri.startsWith("mongodb+srv://")) {
      console.warn("MongoDB SRV lookup failed over UDP port 53. Resolving Atlas replica set via DNS-over-HTTPS...");
      const standardUri = await resolveMongoSrvViaDoH(uri);
      if (standardUri !== uri) {
        return await mongoose.connect(standardUri, {
          dbName: "bookefy",
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
        });
      }
    }
    throw err;
  }
}

export const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local or production settings"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
};
