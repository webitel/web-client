#!/bin/bash
set -e

## MacOS update
mkdir -p /webitel/client/phone-update/osx64/
wget -O /webitel/client/phone-update/osx64/WebitelPhone.dmg https://git.webitel.com/rest/git-lfs/storage/WTEL/webitel-phone/61d0ebaf8aeedf0d45e193f6cf99d7c62c6e5d82ffa3b32fc23bf87793224e69\?response-content-disposition\=attachment%3B%20filename%3D%22WebitelPhone-Installer.dmg%22%3B%20filename\*%3Dutf-8%27%27WebitelPhone-Installer.dmg

## Windows update
mkdir -p /webitel/client/phone-update/win64/
wget -O /webitel/client/phone-update/win64/WebitelPhone.zip https://git.webitel.com/rest/git-lfs/storage/WTEL/webitel-phone/61d0ebaf8aeedf0d45e193f6cf99d7c62c6e5d82ffa3b32fc23bf87793224e69\?response-content-disposition\=attachment%3B%20filename%3D%22WebitelPhone-Installer.dmg%22%3B%20filename\*%3Dutf-8%27%27WebitelPhone-Installer.dmg

## Linux update
mkdir -p /webitel/client/phone-update/linux64/
wget -O /webitel/client/phone-update/linux64/WebitelPhone.tar.gz https://git.webitel.com/rest/git-lfs/storage/WTEL/webitel-phone/61d0ebaf8aeedf0d45e193f6cf99d7c62c6e5d82ffa3b32fc23bf87793224e69\?response-content-disposition\=attachment%3B%20filename%3D%22WebitelPhone-Installer.dmg%22%3B%20filename\*%3Dutf-8%27%27WebitelPhone-Installer.dmg

exit 0