import 'dotenv/config';

import app from './src/app.js';

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`AI Home API listening on port ${port}`);
});
