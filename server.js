const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/convert', upload.array('files'), (req, res) => {
    const outputDir = 'public/output';
    const zipFileName = 'converted_files.zip';

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    const tasks = req.files.map((file, index) => {
        const outputPath = path.join(outputDir, `converted_${index}.webp`);

        return sharp(file.buffer)
            .toFile(outputPath);
    });

    Promise.all(tasks)
        .then(() => {
            const outputZipPath = path.join(outputDir, zipFileName);
            const output = fs.createWriteStream(outputZipPath);
            const archive = archiver('zip');

            output.on('close', () => {
                res.json({ success: true, zipUrl: `/output/${zipFileName}` });
            });

            archive.on('error', (err) => {
                console.error('Archiver error:', err);
                res.json({ success: false });
            });

            archive.pipe(output);
            archive.directory(outputDir, false);
            archive.finalize();
        })
        .catch((err) => {
            console.error('Conversion error:', err);
            res.json({ success: false });
        });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
