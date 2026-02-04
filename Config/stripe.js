// import Stripe from 'stripe';
// import dotenv from 'dotenv';
// import path from 'path';

// // Configure dotenv
// dotenv.config({path: path.join(path.resolve(), "/Config/config.env")});

// // Initialize Stripe with your secret key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default stripe;

//import Stripe from 'stripe';
//import dotenv from 'dotenv';
//import path from 'path';

// Configure dotenv
//dotenv.config({path: path.join(path.resolve(), "/Config/config.env")});

// Initialize Stripe with your secret key
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//export default stripe;
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv (only in development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({path: path.join(path.resolve(), "/Config/config.env")});
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;
