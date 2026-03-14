const dns = require("dns");
const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");

  // Optional override for environments where Node cannot resolve Atlas SRV via system DNS.
  const dnsServers = process.env.DNS_SERVERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (dnsServers?.length) {
    dns.setServers(dnsServers);
    console.log(`Using custom DNS servers: ${dnsServers.join(", ")}`);
  }

  await mongoose.connect(uri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
  console.log("MongoDB connected");
}

module.exports = { connectDb };
