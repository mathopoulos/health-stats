/*
  Central MongoDB client. Other services should import from '@db/client'.
  This currently wraps the clientPromise provided in @server/services/mongodb
  so that we have a single canonical import path for DB access.
*/

import clientPromise from '@server/services/mongodb';
export default clientPromise;

