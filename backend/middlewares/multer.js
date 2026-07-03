import multer from "multer"
import path from "path"

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        console.log("DESTINATION:", path.join(process.cwd(), "public"));
        cb(null, path.join(process.cwd(), "public"))
    },

    filename: (req, file, cb) => {
         console.log("FILENAME:", file.originalname);
        cb(null, Date.now() + "-" + file.originalname)
    }

})

export const upload = multer({ storage })
