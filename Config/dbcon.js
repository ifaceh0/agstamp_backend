//import mongoose from "mongoose";

//export async function dbCon(){
    //try {
       //await mongoose.connect(`mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.zlxnl2f.mongodb.net/ag_stamp?retryWrites=true&w=majority`)
        //console.log("connected to mongodb sucessfully!")
    //} catch (error) {
      // console.log(error) 
  //  }
    
//}
import mongoose from "mongoose";

export async function dbCon(){
    try {
       // ✅ Fixed template literal syntax
       await mongoose.connect(`mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.zlxnl2f.mongodb.net/ag_stamp?retryWrites=true&w=majority`);
       console.log("Connected to MongoDB successfully!");
    } catch (error) {
       console.log("MongoDB connection error:", error);
       process.exit(1); // Exit if DB connection fails
    }
}
