[![Build Status](https://secure.travis-ci.org/untoldone/bloomapi.png)](http://travis-ci.org/untoldone/bloomapi)
[![Dependency Status](https://gemnasium.com/untoldone/bloomapi.svg)](https://gemnasium.com/untoldone/bloomapi)

An open source library for maintaining an updated mirror of the [NPI Data Dissemination](http://nppes.viva-it.com/NPI_Files.html) and making it queriable via API.
A public deployment of BloomAPI can be seen at http://www.bloomapi.com/

The public deployment is on the most recent release, but http://latest.bloomapi.com/ hosts more recent copies.

For **documentation** see http://www.bloomapi.com/documentation

For details on **contributing** see http://www.bloomapi.com/contribute

### Roadmap

Given interest, more will be added based on real-life use cases. Some example use cases include:

- Searching for providers at a specific facility
- Searching for providers by geo-coded locations (think queries like 'give me all the doctors in a 10 mile radius of this address')
- Marrying with other datasource such as using Hospital Compare data to show which doctors work at facilities that meet specific quality requirements
- For use as a starting point in generating new data such as a national provider-to-payer database or for running physician surveys
- For use by CMS or others in identifying low quality NPI data and correcting it
- Detecting noteworthy changes and historical values of NPI data over time such as doctors's affiliations with payers
- Tools to authenticate a clinician is who she says she is using the NPI + weekly disseminations
