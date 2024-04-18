const mongooseData = require('mongoose');

const recipeListSchema = new mongooseData.Schema({
    name: {
        type: String,
        required: true
    },
});

const listOfRecipes = mongooseData.model('RecipeList', recipeListSchema);

module.exports = listOfRecipes;