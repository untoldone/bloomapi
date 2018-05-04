Public Data
=======

BloomAPI Public Data is a way to programatically access public datasets. It may be queried by a software developer for use in application development. The documentation below explains how, as a software developer, to use or deploy your own copy of BloomAPI Public Data.

Note that anything marked as *Experimental* in this documentation may be removed without warning in a future release. If you’d like to depend on these features in production, sign up for an account or consider hosting your own copy of BloomAPI Public Data.


API Usage
=======

Calling
---------------

BloomAPI is a http-based API. It can be queried at <http://localhost:3005/api/> or at the url of your own deployment.

``` javascript
 Example 200 Response

 curl -XGET http://localhost:3005/api/search/usgov.hhs.npi
 ```
Experimental JSONP is currently supported by providing a `callback` method through the parameter callback.

All responses are JSON objects with the following parameters.

| Name          | Description
| ------------- |:-------------:|
| meta          | Information related to the query such as number or results or warning messages |
| results       | Payload response such as the data being queried for                            |



 ``` javascript
  { "meta":
    {
      "count": 1923
    },
    "result": [
      {
        "npi": 1111111111,
        "type": "individual"
      }
    ]
  }
```






Errors
---------------
Errors are communicated through http return codes. Codes that are returned by BloomAPI include.

``` javascript
Example 400 Response
```

400 errors also include a JSON response object explaining the cause of the error.

``` javascript

{
  "error:": "Error message",
  "type": "parameter|fatal",
  "details": {
    "some-key": "An object that represents this error type"
  }
}

```

* 400: User error such as invalid parameters.
* 404: API endpoint or entity not found.
* 5xx: Server error. Likely caused by a bug in BloomAPI.



API Key
---------------

Development access at <http://localhost:3005/api> is available without an API key, however, for production access, for https access, or for access to private data sources — an API key is required. Some of the current private datasources include:

* Federal Sanctions List
* PECOS
* Hospital Compare
* ICD-9/10/ Crosswalks
* HCPCS
* FDA NDC
* AHRQ files
* CCLF (Claims and Claims Line Feed)
* If you are interested in datasources such as these or unlimited production access, you’ll need a  BloomAPI Account.

Sign Up to request an API Key.

Once you have an API key, it can be added to any request by adding the parameter secret to any request.

``` javascript
Example Usage of API Key

http://localhost:3005/api/search/usgov.hhs.npi?secret=:api_key_here&key1=practice_address.zip&op1=eq&value1=98101
```

Programatic Clients
=======

There are a number of libraries written for BloomAPI Public Data. Several are listed below. Please Let us know if you’ve created your own client so we can list here.

#### NODE.JS/ BROWSER JAVASCRIPT

* BloomJS created by Micheal Wasser.

### .NET

* BloomAPI.net created by Michael Wasser.

### RUBY

* bloom_api Gem created by Dan Carpenter.

Endpoints
=======

/api/search/:source
------------

Returns search results given a datasource. `:source` should be replaced by the datasource your currently searching (for example, `usgov.hhs.npi`).

### Parameters

``` javascript
  Examples
```

* `key` name of field to filter by. Replace * with any number to set the 'index number’. The index number is used to associate keys with an 'op’ and 'value’.
* `op` search operation to apply for a given index number. Currently supports the following values:
  ..* eq exact match
  ..* gt greater than
  ..* lt less than
  ..* gte greater than or equal
  ..* lte less than or equal
  ..* prefix experimental matches the prefix of the string. Useful for real-time search/ autocomplete.
  ..* fuzzy experimental uses a fuzzy match search. Useful for correcting spelling errors.
* value* value to search for given an index number. String must be uppercase.
* limit optional, sets the maximum number of records to return. Default is 20 and maximum is 100
* offset optional, sets a number of records to skip before returning. Default is 0

``` javascript
  Query for all clinicians that practice in the zipcode ‘98101’

  GET http://localhost:3005/api/search/usgov.hhs.npi?limit=10&offset=0&key1=practice_address.zip&op1=eq&value1=98101

  Query for all clinicians that have a last name of 'Dennis’ and practice in the zipcode '943012302’

  GET http://localhost:3005/api/search/usgov.hhs.npi?limit=10&offset=0&key1=last_name&op1=eq&value1=DENNIS&key2=practice_address.zip&op2=eq&value2=943012302

```


### Response Fields

This depends on the data sources used. See the Data Sources section for a description of fields for a given data source.


/api/sources
------------


Returns the current datasources and their status.

### Response Fields

The result will be an array of data sources.

| Field         | Description
| ------------- |:-------------:|
| source        | Identifier of datasource. The only datasource is 'NPI’ for now              |
| updated       | Timestamp of the last time the datasource was updated                       |
| check         | Timestamp of the last time BloomAPI checked for additional data for this  datasource                                                                                    |
| status        |  Legacy field. Will always `READY`                                          |


/api/sources/:source/:id
------------

Returns a specific element of a particular source. For example, the NPI’s :id would be an NPI to return information for.

```
    Example

    The following would return the details of the NPI 1376954206.
```

``` javascript
  GET http://localhost:3005/api/sources/usgov.hhs.npi/1376954206
```

DATA SOURCES
=======

#### usgov.hhs.npi

Each field’s description is directly from the NPI dissemination documentation present in the dissemination files. Source fields are the name of the column in the source CSVs before they are translated for bloomapi.

Field metadata will be included soon

#### usgov.hhs.hcpcs

CMS HCPCS codes as documented at <https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets/index.html>

Field metadata will be included soon

#### usgov.hhs.pecos

Provider Enrollment and Certification data as documented by CMS

Field metadata will be included soon

#### usgov.hhs.medicare_specialty_codes

Medicare Specialty Code to Provider Taxonomy Code mapping from CMS

Field metadata will be included soon

#### nucc.hcpt

Provider Taxonomy Codes as provided by NUCC

Field Metadata will be included soon

#### usgov.hhs.icd_9_cm

ICD 9 CM Diagnosis Codes as provided by CMS

#### usgov.hhs.icd_10_cm

2015 ICD 10 CM Codes as provided by CMS

#### usgov.hhs.icd_9_gems

2015 ICD 9 to 10 GEMS as provided by CMS

#### usgov.hhs.icd_10_gems

2015 ICD 10 to 9 GEMS as provided by CMS

#### Other

BloomAPI Public Data is great at loading complex datasets quickly. We also support loading from many other datasources that require private data such as:

* Claims and Claims Line Feed
* AHRQ inpatient/ outpatient/ emergency databases
* HL7v2
* CCDs (HL7v3)

If you’d like access to an API with data from one of the above or would like another datasource to be included, please contact support

DEPLOY
=======

Deploy your own copy of BloomAPI to gain higher performance or high availability to meet your own SLAs. Alternatively deploy it to gain an on-site database containing the most recent copies of datasets such as the NPI.

Note that if you are just looking to setup bloomapi locally — the detailed setup instructions in the Contribute page may be easier to follow. This section is more about deploying BloomAPI in a production environment.

A BloomAPI deployment is made up of four core components

1. API service
1. Data worker/ processor service
3. PostgreSQL (version 9.3)
4. ElasticSearch (version 1.4)

Both the API service and the Data worker are written in Go and can be compiled using the `go install` command. Dependencies in each project are managed using the Godep tool.

Once Go (1.3+) has been installed and configured with a GOPATH, and Godep has been installed, you can clone the repositories using

`go get github.com/untoldone/bloomapi`

`go get github.com/gocodo/bloomnpi`

Once fetched, change into each of the bloomapi/ npi source directory roots and run godep restore.

Run `go install github.com/untoldone/bloomapi github.com/gocodo/bloomnpi` to build the code into your $GOPATH/bin directory. If you are running on a mac, but want to cross-compile for a linux system, you can run make from the bloomapi/ npi source directories. If cross-compiling, the go binaries `gox and gonative` must also be installed and configured.

Once compiled, copy the bloomapi binary from $GOPATH/bin, and config.toml, bootstrap.sql, and drop.sql from the bloomapi source directory to an install directory of your choice. For the bloomnpi binary, copy the binary, config.toml, and the sql directory to a different install directory. Create a data directory in the destination for bloomnpi as well.

Edit both `config.toml` files to point to your postgresql and elasticsearch deployments.

Once compiled and configured, you must bootstrap your environment as follows

`[bloomapi install path]/bloomapi bootstrap`

Change to the `bloomnpi` source directory (`bloomnpi` requires access to the files in the `sql` directory). Also note, if you want to run the `bloomnpi` binary without the source code, you'll need to copy this directory to be in the top level of the working directory you are running `bloomnpi` from.

`[bloomnpi install path]/bloomnpi bootstrap`

`[bloomnpi install path]/bloomnpi fetch`

`[bloomnpi install path]/bloomnpi search-index`

This will download and index available datasources.

It will likely make sense to add `fetch` and `search-index` as a cron job to ensure your datasets are updated on a regular basis.

Finally, to start the api, run `bloomapi server`. This will start the server on the port specified in your config.toml file.
