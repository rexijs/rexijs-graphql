let { graphql } = require('graphql');
let { makeExecutableSchema } = require('graphql-tools');
const { GraphqlHelper } = App.helpers();

module.exports = {
  register() { },
  async boot({ app, type }) {
    if (type !== 'express') return;

    let router = require('express').Router();
    let authMidd = await GraphqlHelper.auth();

    router.post('/graphql', authMidd, async (req, res) => {
      let compact = require('./compact')(req);

      if (!req.body.schema || !req.body.query) {
        return res.status(422).json({ message: 'Bad request' });
      }

      if (!compact[req.body.schema]) {
        return res.status(422).json({ message: `Schema ${req.body.schema} not exists` });
      }

      let grres = await graphql(
        makeExecutableSchema(await GraphqlHelper.genTypes(compact[req.body.schema])),
        req.body.query
      );

      if (grres.errors) {
        return res.status(401).json({ errors: grres.errors });
      }

      return res.status(200).json(grres.data);
    });

    app.use(router);
  }
};
