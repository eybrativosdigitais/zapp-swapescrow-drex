/* eslint import/no-extraneous-dependencies: "off" */
/* ignore unused exports */

/**
Mongo database functions
*/

import mongo from 'mongodb'

const { MongoClient } = mongo
var CacheMongoConnection = null

export default {
  async connection (url) {
    if (CacheMongoConnection) {
      try {
        // Try to use the connection to check if it's still alive
        await CacheMongoConnection.db().command({ ping: 1 });
        return CacheMongoConnection;
      } catch (error) {
        console.log('MongoDB connection lost, reconnecting...');
      }
    }
    console.log(`creating new connection to mongo: ${url}`)
    // Check if we are connecting to MongoDb or DocumentDb
    const { MONGO_CONNECTION_STRING = '' } = process.env
    if (MONGO_CONNECTION_STRING !== '') {
      const client = await new MongoClient(`${MONGO_CONNECTION_STRING}`, {
        useUnifiedTopology: true
      })
      CacheMongoConnection = await client.connect()
    } else {
      const client = await new MongoClient(url, {
        useUnifiedTopology: true,
        connectTimeoutMS: 40000
        // keepAlive: true,
        // serverSelectionTimeoutMS: 30000,
        // socketTimeoutMS: 360000,
      })
      CacheMongoConnection = await client.connect()
    }
    return CacheMongoConnection
  },
  async disconnect (url) {
    CacheMongoConnection.close()
  }
}
