const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const axios = require("axios");
const app = express();
const cors = require("cors");
const RecipesList = require("./models/ListOfRecipes");
const cheerio = require("cheerio");
app.use(bodyParser.json());

const PORT = 8080;
const MONGODB_URI = 'mongodb://localhost:27017/recipe_db';

app.use(cors());

const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const fetchHtmlContent = async (url) => {
    try {
        console.log("url", url)
        const response = await axios.get(url);
        console.log("response", response.data)
        return response.data;
    } catch (error) {
        throw new Error('Error fetching HTML content:');
    }
};

const parseJsonData = (htmlData) => {
    const $ = cheerio.load(htmlData);
    const recipes: any = [];
    $('article').each((index, element) => {
        const recipe: any = {};
        recipe.name = $(element).find('h2').text().trim();
        console.log("obj", recipe)
        recipes.push(recipe);
    });

    console.log("list of adta", recipes)
    return recipes;
}
const parseRecipeDetails = (htmlData) => {
    const $ = cheerio.load(htmlData);
    const recipes: any = [];
    $('article').each((index, element) => {
        const recipe: any = {};
        recipe.name = $(element).find('h2').text().trim();
        console.log("obj", recipe)
        recipe.ingredients = [];
        $(element).find('.wprm-recipe-ingredient').each((i, el) => {
            recipe.ingredients.push($(el).text().trim());
        });
        recipe.instructions = [];
        $(element).find('.wprm-recipe-instruction-text').each((i, el) => {
            recipe.instructions.push($(el).text().trim());
        });
        recipes.push(recipe);
    });

    console.log("list of adta", recipes)
    return recipes;
}
//API to parse web url
app.post('/parse-url', async (req, res) => {
    try {
        const { url } = req.body;
        const htmlData = await fetchHtmlContent(url);
        const recipeData = parseJsonData(htmlData);
        const recipesToSave = recipeData.slice(1);
        const savedRecipes = await RecipesList.insertMany(recipesToSave.map(recipe => ({ name: recipe.name })));
        res.json({ data: recipesToSave, message: 'Recipes saved successfully' });
    } catch (error) {
        console.error('Error parsing recipe:', error);
        res.status(500).json({ error: 'Error  while extracting or saving recipe' });
    }
});

//API to get list of recipes
app.get('/getRecipeList', async (req, res) => {

    try {
        const recipes = await RecipesList.find();
        res.status(200).json({ data: recipes, message: "success" });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/getRecipeDetails', async (req, res) => {
    try {
        const { recipeName } = req.body;
        const selectedRecipe = recipeName.replace(/\s+/g, '-')
        const url = `https://www.indianhealthyrecipes.com/${selectedRecipe}`
        console.log("url", url);
        const htmlData = await fetchHtmlContent(url);
        console.log("data", htmlData);
        const recipeData = parseRecipeDetails(htmlData);
        console.log("recipeData", recipeData);
        res.status(200).json({ data: recipeData, message: "success" });
    } catch (error) {
        console.error('Error parsing recipe:', error);
        res.status(500).json({ error: 'No Data Found' });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
