const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '..');
const viteBin = path.join(rootDir, 'node_modules', '.bin', 'vite');

async function build() {
  try {
    // Pre-flight check for Vite binary
    if (!fs.existsSync(viteBin)) {
      console.error('================================================================');
      console.error('FATAL: Vite executable not found at the expected path:');
      console.error(viteBin);
      console.error('\nThis indicates that `npm install` did not create the binary links.');
      console.error('This is a known issue in some sandboxed environments.');
      console.error('The build cannot continue.');
      console.error('================================================================');
      process.exit(1);
    }

    // 1. Clear the dist directory
    console.log('Cleaning dist directory...');
    await fs.emptyDir(distDir);

    // 2. Run Vite build for the popup
    console.log('Building popup with Vite...');
    // Use the direct path to avoid PATH issues with npx/sh
    execSync(`"${viteBin}" build`, { stdio: 'inherit', cwd: rootDir });

    // 3. Copy static assets
    console.log('Copying static assets...');
    const assets = ['scripts', 'content', 'icons', 'lib'];
    for (const asset of assets) {
      const sourcePath = path.join(rootDir, asset);
      if (fs.existsSync(sourcePath)) {
        await fs.copy(sourcePath, path.join(distDir, asset));
      }
    }

    // 4. Read, modify, and write manifest.json
    console.log('Processing manifest.json...');
    const manifestPath = path.join(rootDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);

    // Modify paths for the dist folder
    manifest.action.default_popup = 'popup.html';

    const distManifestPath = path.join(distDir, 'manifest.json');
    await fs.writeJson(distManifestPath, manifest, { spaces: 2 });

    console.log('\n✅ Extension build complete!');
    console.log(`Ready to be loaded from: ${distDir}`);

  } catch (error) {
    console.error('\n❌ Build failed:');
    console.error(error);
    process.exit(1);
  }
}

build();
