import { execSync } from "child_process";
import { Client } from "basic-ftp";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.deploy" });

const MAX_RETRIES = 3;

async function connect(client) {
  console.log("🔌 Connecting...");

  await client.access({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT || 21),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: false,
  });

  console.log("✅ FTP Connected");
}

async function deploy() {
  console.log("🚀 Building React...");

  execSync("vite build", {
    stdio: "inherit",
  });

  const client = new Client();

  // Give the FTP connection up to 5 minutes before timing out
  client.ftp.timeout = 300000;

  // Enable temporarily so we can diagnose the FTP issue
  client.ftp.verbose = true;

  try {
    await connect(client);

    const remote = process.env.REMOTE_PLUGIN_PATH;

    if (!remote) {
      throw new Error("REMOTE_PLUGIN_PATH is not defined in .env.deploy");
    }

    await client.ensureDir(remote);

    const localAssets = path.resolve(process.cwd(), "../build/assets");

    console.log("📁 Local assets:", localAssets);

    if (!fs.existsSync(localAssets)) {
      throw new Error(`Local assets folder not found:\n${localAssets}`);
    }

    const files = fs.readdirSync(localAssets).filter((file) => {
      const fullPath = path.join(localAssets, file);

      return fs.statSync(fullPath).isFile();
    });

    if (files.length === 0) {
      throw new Error("No files found in build/assets");
    }

    console.log(`📦 Found ${files.length} assets`);

    // ---------------------------------------------
    // STEP 1: Upload all new assets
    // ---------------------------------------------

    console.log("⬆ Uploading new assets...");

    for (const file of files) {
      const fullPath = path.join(localAssets, file);
      const remotePath = `${remote}/${file}`;

      let uploaded = false;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(
            `⬆ Uploading: ${file} (attempt ${attempt}/${MAX_RETRIES})`,
          );

          await client.uploadFrom(fullPath, remotePath);

          console.log(`✅ Uploaded: ${file}`);

          uploaded = true;
          break;
        } catch (error) {
          console.error(`⚠️ Upload failed for ${file}`);

          if (error instanceof Error) {
            console.error(error.message);
          } else {
            console.error(error);
          }

          if (attempt === MAX_RETRIES) {
            throw new Error(
              `Failed to upload ${file} after ${MAX_RETRIES} attempts.`,
            );
          }

          console.log("🔄 Reconnecting FTP...");

          try {
            client.close();
          } catch {
            // Ignore close errors
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));

          await connect(client);
          await client.ensureDir(remote);
        }
      }

      if (!uploaded) {
        throw new Error(`Upload failed: ${file}`);
      }
    }

    // ---------------------------------------------
    // STEP 2: Clean old assets only after
    // everything uploaded successfully
    // ---------------------------------------------

    console.log("🗑 Cleaning old JS/CSS assets...");

    const remoteFiles = await client.list(remote);

    for (const remoteFile of remoteFiles) {
      const fileName = remoteFile.name;

      const isJsOrCss = fileName.endsWith(".js") || fileName.endsWith(".css");

      const existsInNewBuild = files.includes(fileName);

      if (isJsOrCss && !existsInNewBuild) {
        await client.remove(`${remote}/${fileName}`);

        console.log("🗑 Deleted old asset:", fileName);
      }
    }

    console.log("✅ Deployment Complete");
  } catch (error) {
    console.error("❌ Deployment Failed");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    client.close();
  }
}

deploy();
