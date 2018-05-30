### Changelog

#### [v0.4.0](https://github.com/w33ble/simple-knex-model/compare/v0.3.0...v0.4.0) (16 May 2018)
- feat: validate on update [`#1`](https://github.com/w33ble/simple-knex-model/issues/1)
- feat: add beforeUpdate hook [`#3`](https://github.com/w33ble/simple-knex-model/issues/3)
- **Breaking:** feat: change save hook to beforeCreate [`921eeb6`](https://github.com/w33ble/simple-knex-model/commit/921eeb60e31506ac3f976c1e3d1860de37776f2e)
- feat: handle one-to-one relationships [`6c04ecd`](https://github.com/w33ble/simple-knex-model/commit/6c04ecdf8ee77e9c38dc5e75e03d5f9ba786c563)
- fix: throw ModelError without knex instance [`cfdc8c5`](https://github.com/w33ble/simple-knex-model/commit/cfdc8c5b897d9ae2153eec6ccb6bc9b58167638c)
- fix: call beforeValidate on update method [`d3d97e0`](https://github.com/w33ble/simple-knex-model/commit/d3d97e0e77ab9d9f7cad0aa1bf721e404ba77f00)
- fix: return document without primary key value [`ddd5e8c`](https://github.com/w33ble/simple-knex-model/commit/ddd5e8caaa952d226a3d9076f32ab59c4dc1e5e2)

#### [v0.3.0](https://github.com/w33ble/simple-knex-model/compare/v0.2.1...v0.3.0) (15 May 2018)
- feat: auto-resolve relationship table and field names [`#2`](https://github.com/w33ble/simple-knex-model/issues/2)
- feat: throw custom error types [`5ecc287`](https://github.com/w33ble/simple-knex-model/commit/5ecc2879dd3203df7da85e3244859bcde5706689)
- feat: validate model name [`8c32380`](https://github.com/w33ble/simple-knex-model/commit/8c32380b2aeced11287474456a06de8000ca94d7)

#### [v0.2.1](https://github.com/w33ble/simple-knex-model/compare/v0.2.0...v0.2.1) (11 May 2018)
- feat: add validate method [`16a9eb1`](https://github.com/w33ble/simple-knex-model/commit/16a9eb13287bfdf8265c68b4b5cd0de6ed3b4198)

#### [v0.2.0](https://github.com/w33ble/simple-knex-model/compare/v0.1.0...v0.2.0) (11 May 2018)
- **Breaking:** feat: add queryById, remove byId [`ede3e33`](https://github.com/w33ble/simple-knex-model/commit/ede3e332d1ffce7bbd7c5e8f051f57d0b2de899e)
- **Breaking:** feat: remove fields arg from byId [`661f5da`](https://github.com/w33ble/simple-knex-model/commit/661f5da217c52de8a25e1391b79005bf7f0a9aa0)

#### v0.1.0 (8 May 2018)
- docs: update readme with relationship info [`2662149`](https://github.com/w33ble/simple-knex-model/commit/2662149e1511ba2c32f5684a550b05f09fdcd742)
- feat: add belongsToMany support [`e9412ff`](https://github.com/w33ble/simple-knex-model/commit/e9412ff5411521535f998bd278a527fdb2c72a8c)
- feat: add validation methods to model [`4767b03`](https://github.com/w33ble/simple-knex-model/commit/4767b0349476a2b10d1998da06015a2b33615c0c)
- feat: add relationship mapping support [`57be109`](https://github.com/w33ble/simple-knex-model/commit/57be109ade778a7e864447c682e4c2465f3b6a57)
- feat: add a model registry [`ee595ff`](https://github.com/w33ble/simple-knex-model/commit/ee595ff43218ed7839b717c1f4bbd9f230f7097a)
- docs: add hook info to readme [`17a94e6`](https://github.com/w33ble/simple-knex-model/commit/17a94e66eb262debabed1b866d203c139f7d5cc2)
- feat: add operation hooks [`2569b9e`](https://github.com/w33ble/simple-knex-model/commit/2569b9ec1d261dcf1b0c214c75e86578e7eb4b4d)
- docs: add info and usage to readme [`a9f4318`](https://github.com/w33ble/simple-knex-model/commit/a9f43180a93108ba0d0a02078d0869a8962d42e1)
- feat: simple base model [`aac4525`](https://github.com/w33ble/simple-knex-model/commit/aac45257af1f0296cb25cef810a161b8565c1e0d)
- initial commit [`408c7d1`](https://github.com/w33ble/simple-knex-model/commit/408c7d1936f0a55cd766828f3e2c3b32f1a3d71d)

