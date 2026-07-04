import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public");

// Folder exist na ho to create karo
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created upload directory:", uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("DESTINATION:", uploadDir);
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        console.log("FILENAME:", file.originalname);
        cb(null, Date.now() + "-" + file.originalname);
    }
});

export const upload = multer({ storage });
