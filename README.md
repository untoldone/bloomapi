[![Build Status](https://secure.travis-ci.org/untoldone/bloomapi.png)](http://travis-ci.org/untoldone/bloomapi)

An open source library for maintaining an updated mirror of the [NPI Data Dissemination](http://nppes.viva-it.com/NPI_Files.html) and making it queriable via API.
A public deployment of BloomAPI can be seen at http://www.bloomapi.com/

## API User Documentation

_TODO: write api documentation_

## BloomAPI Contributor Documentation

### Setting up a development environment

BloomAPI has the following runtime dependencies

- nodejs 0.10+ (and a number of nodejs packages installable via npm)
- postgreSQL
- pdftotext (command line tool)
- p7zip

_See sections below for details on how to install the dependencies on mac OSX and ubuntu._

Once the dependencies have been installed:

1. Create a database in postgreSQL and a user/password combination that has access to it.
1. Copy config.js.sample to config.js and edit the file as is needed given the database you've created for BloomAPI.
1. A one-time bootstrap script will automatically download the most recent data dissemination, unzip and import it's data into postgres.
   Run it by typing `node make bootstrap` from the root of the source directory.

#### Dependency installation on mac OSX

Since several dependencies require you build source code, Xcode must be installed with the Command Line 
Tools option enabled to complete the following instructions.

Using [homebrew](https://github.com/mxcl/homebrew):

    brew install nodejs p7zip xpdf postgresql
    cd <bloomapi source dir>
    npm install

#### Dependency installation on ubuntu 13.04

    sudo apt-get install -y p7zip-full poppler-utils g++ make nodejs postgresql-9.1 postgresql-server-dev-9.1
    cd <bloomapi source dir>
    npm install

#### Dependency Troubleshooting

If you are having trouble with the bootstrap task or running the server, try running `node make check`
to verify that dependencies have been properly installed.

### Deploying Production Copy of BloomAPI

_note these installation instructions have not be formally tested yet -- please update if you find errors!_

BloomAPI provides a set of [Ansible](http://www.ansible.cc) playbooks that can be used to automatically
deploy BloomAPI and all of its dependencies on top of a clean installation of Ubuntu 13.04.

To install Ansbile on mac OSX:

    brew install python --framework
    sudo pip install ansible

To install Ansible on Ubuntu

    sudo apt-get install python
    sudo easy_install pip
    sudo pip install ansible

To see more details on install Ansible, see the [Ansible Getting Started](http://www.ansibleworks.com/docs/gettingstarted.html) page.

Once ansible is installed.

1. Create a clean installation of Ubuntu 13.04. The machine should have at least 12GB of free disk space for the dissemination
   file downloads/ extraction
1. Ensure a user named 'ubuntu' has sudo access without requiring a password
1. You should also have setup an ssh authorized\_keys on the new machine with your ssh public key in the ubuntu account's `.ssh/authorized_keys` file
1. Edit the file at `ansible/stage` and replace `www-01.bloomapi.com` with the uri of your new Ubuntu installation
1. From the source directory, run `ansible-playbook ansible/site.yml`

Once the playbook is complete, your box should have a fully-functional installation of BloomAPI with a fresh copy of the data dissemination.
The new server will be listening for requests at `<hostname>/` for the documentation website and at `<hostname>/api` for the API itself.

### Testing

1.  Install jasmine-node globally with `npm i -g jasmine-node`
1.  Run tests with `jasmine-node spec` from the root of the source directory

### Roadmap

The current featureset is very minimal but in time more will be added based on real-life use cases. Some example use cases include:

- Searching for providers at a specific facility
- Searching for providers by geo-coded locations (think queries like 'give me all the doctors in a 10 mile radius of this address')
- Marrying with other datasource such as using Hospital Compare data to show which doctors work at facilities that meet specific quality requirements
- For use as a starting point in generating new data such as a national provider-to-payer database or for running physician surveys
- For use by CMS or others in identifying low quality NPI data and correcting it
- Detecting noteworthy changes and historical values of NPI data over time such as doctors's affiliations with payers

In addition, there are a number of tactical/ implementation changes that can be made to improve the quality of the API itself. This is the task list for the first release (0.1.0):

**High Priority**
- Automated importing of new dissemination files as they are available. Bonus points if this can be done with no down time
- ~~Add indexing on searchable fields to increase performance~~ (see pr #2)

**Medium Priority**
- Metadata and code to automatically denormalize npi database. Clearest cases are when there's a index numbers at the ends of the NPI column names, less
  clear cases include business addresses etc -- this will make some of the above use cases more realistic such as finding all the physicians at one location
- Importing the weekly incremental disseminations
- Providing api-health information such as when the database itself was last updated and providing references to the data file each record came from
- Currently can only search by 'zip' and 'last\_name' -- add more accepted query terms
- Result paging to ensure lower query times (like 'skip first 40 records and take the next 20')
- User documentation of API
- User documentation of how to set up local environment (for now, look in the `ansible/` folder/create a `config.js`, `node make.js bootstrap`, and then `node make.js server`

**In spare time...**
- API performance metrics to ensure API slowness does not hurt usability of applications that depend on API
- Simplify these docs/ move them to bloomapi.com
