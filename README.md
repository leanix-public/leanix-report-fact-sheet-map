# leanix-report-fact-sheet-map

> LeanIX custom report build with Vue.js.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# upload report to LeanIX
npm run upload
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Report Configuration
This report can be configured according the specifications defined by its config object. Find below an example for the report standard configuration.

```json
{
  "allowedFactsheetTypes": ["BusinessCapability", "UserGroup", "TechnicalStack", "DataObject"]
}
```


Properties
----------

| Name                        | Type                                | Required | Default value                    | Info                                                                                                   |
| --------------------------- | ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **allowedFactsheetTypes**           | Array                              | No       | ["BusinessCapability"]                      | Allowed factsheet types in the report                                                              |