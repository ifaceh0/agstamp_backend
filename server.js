import { app } from "./app.js";
import { dbCon } from "./Config/dbcon.js";



//db connection
dbCon();

app.listen(process.env.PORT,()=>{
    console.log(`application running on port no>  http://localhost:${process.env.PORT}`)
})

// import { app } from "./app.js";
// import { dbCon } from "./Config/dbcon.js";



// //db connection
// dbCon();

// const PORT = process.env.PORT || 5000;

// app.listen(PORT,()=>{
//     console.log(`application running on port no>  http://localhost:${PORT}`);
// })


// // updated code for lambda deployment
// import serverless from "serverless-http";
// import { app } from "./app.js";
// import { dbCon } from "./Config/dbcon.js";

// // Connect DB once (cold start)
// await dbCon();

// // Export handler for Lambda
// export const handler = serverless(app);
