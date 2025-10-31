const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51RBcPP2LJgjSDCRZ9DIwQKh8bN2NIIq9Dse7WAx0ZZQmSZsHsCueedGFtiJBXRmSy9fAFfKPpoKpOTVetoINGzvE00MWJmKqg9"
); // à remplacer par ta clé secrète Stripe

module.exports = stripe;
