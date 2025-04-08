import multer from 'multer'
// const upload = multer({ dest: 'uploads/' })

// const app = express()


const storage = multer.diskStorage({
    destination: function (req: any, file : any, cb : any) {
      cb(null, '/uploads/profile_image')
    },
    filename: function (req : any, file : any, cb: any) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage: storage })

  