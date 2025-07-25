// This middleware preserves the raw body for Stripe webhook signature verification
exports.rawBodyParser = (req, res, next) => {
    let data = ""
  
    req.on("data", (chunk) => {
      data += chunk
    })
  
    req.on("end", () => {
      req.rawBody = data
      next()
    })
  }
  