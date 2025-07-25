import { app } from "./app.js";
import { dbCon } from "./Config/dbcon.js";



//db connection
dbCon();

app.listen(process.env.PORT,()=>{
    console.log(`application running on port no>  http://localhost:${process.env.PORT}`)
})
