BloomAPI
========

BloomAPI was originally this open source project. While BloomAPI is now a company with a different focus, this project is still actively maintained as set of libraries and executables to translate existing datasources into performant APIs. A public deployment of BloomAPI as well as more information can be found at https://www.bloomapi.com/documentation/public-data.

To get a locally running copy of BloomAPI (only prerequisite is Docker with 4GB+ of memory -- if you are on a mac, you have to set this under docker preferences->advanced):

1. Download https://raw.githubusercontent.com/untoldone/bloomapi/master/docker-compose.yml
2. Run `docker-compose up -d` from the same directory

Data loading will happen automatically. You can view the progress of the initial data load with `docker-compose logs -f`. Once the initial data load is complete, test the API via http://localhost:3005/api/search/usgov.hhs.npi.

Code is also available for the current publically hosted datasources at https://github.com/bloomapi/datasources. This includes the NPI, ICD9, ICD10, PECOS and others.

Today, BloomAPI is focused on simplifying the way medical data is shared through technical and non-technical means. For more information about BloomAPI the company, see https://www.bloomapi.com.

### Questions?

Please email [info@bloomapi.com](mailto:info@bloomapi.com). If you think your issue may be a bug, see *Issues* below.

### Issues?
We use github issues to track problems and enhancement requests. If you have an issue or enhancement you'd like to see implemented, please open a new issue and we will sort it appropriately.

- [Current issues](https://github.com/untoldone/bloomapi/issues?q=-milestone%3ABacklog+is%3Aissue+is%3Aopen+) in focus for a future release or for review 
- [Current backlog](https://github.com/untoldone/bloomapi/issues?q=milestone%3ABacklog+is%3Aissue+is%3Aopen+) of issues that have been saved for later
