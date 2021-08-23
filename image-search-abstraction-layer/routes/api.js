const fetch = require('node-fetch');
require('dotenv').config({ path: process.cwd() + '/.env' });

module.exports = function (app, Url) {
  app.route('/recent').get(async (req, res) => {
    const url = await Url.findOne({}).sort({ createdAt: -1 });

    if (url) {
      try {
        const data = await fetch(url.url).then((res) => res.json());

        res.json(data.items);
      } catch (error) {
        console.log(error);
      }
    } else {
      res.send('There is no recent search at the moment');
    }
  });

  app.route('/query/:q').get(async (req, res) => {
    const query = req.params.q;
    const { page, size } = req.query;

    const url = `https://customsearch.googleapis.com/customsearch/v1?key=${
      process.env.APIKEY
    }&cx=cf49f0941784b0b45&searchType=image&q=${query}&num=10&start=${page * 10 - 9}${size ? `&imgSize=${size}` : ''}`;

    try {
      const data = await fetch(url).then((res) => res.json());

      const newUrl = new Url({
        url,
      });

      await newUrl.save();

      res.json(data.items);
    } catch (error) {
      console.log(error);
    }
  });
};
