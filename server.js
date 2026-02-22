// import { app } from "./app.js";
// import { dbCon } from "./Config/dbcon.js";



// //db connection
// dbCon();

// app.listen(process.env.PORT,()=>{
//     console.log(`application running on port no>  http://localhost:${process.env.PORT}`)
// })

// import { app } from "./app.js";
// import { dbCon } from "./Config/dbcon.js";



// //db connection
// dbCon();

// const PORT = process.env.PORT || 5000;

// app.listen(PORT,()=>{
//     console.log(`application running on port no>  http://localhost:${PORT}`);
// })



// updated code for lambda deployment
import { app } from "./app.js";
import { dbCon } from "./Config/dbcon.js";
import serverless from "serverless-http";

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    await dbCon();
    isConnected = true;
  }
};

const handler = serverless(app);

export const main = async (event, context) => {
  await connectDB();
  return handler(event, context);
};