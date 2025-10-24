#!/bin/bash

# FreeSWITCH Installation Script for Ubuntu/Debian
# W3 VoIP System - Local Development Environment

set -e

echo "🚀 Installing FreeSWITCH for W3 VoIP System..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    wget \
    gnupg2 \
    software-properties-common \
    build-essential \
    cmake \
    git \
    pkg-config \
    libssl-dev \
    libncurses5-dev \
    libnewt-dev \
    libxml2-dev \
    libsqlite3-dev \
    uuid-dev \
    libjansson-dev \
    libbzip2-dev \
    libcurl4-openssl-dev \
    libpcre3-dev \
    libspeex-dev \
    libspeexdsp-dev \
    libldns-dev \
    libedit-dev \
    libtiff5-dev \
    libsndfile1-dev \
    libmpg123-dev \
    libmp3lame-dev \
    libopus-dev \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libavresample-dev \
    libavfilter-dev \
    libavdevice-dev \
    libflite1-dev \
    libsndfile1-dev \
    libsamplerate0-dev \
    libsoxr-dev \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    gstreamer1.0-x \
    gstreamer1.0-alsa \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3 \
    gstreamer1.0-qt5 \
    gstreamer1.0-pulseaudio \
    libav-tools \
    ffmpeg

# Add FreeSWITCH repository
wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | sudo apt-key add -
echo "deb http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" | sudo tee /etc/apt/sources.list.d/freeswitch.list
echo "deb-src http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/freeswitch.list

# Update package list
sudo apt update

# Install FreeSWITCH
sudo apt install -y freeswitch freeswitch-mod-commands freeswitch-mod-conference freeswitch-mod-dptools freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-db freeswitch-mod-dialplan-xml freeswitch-mod-dingaling freeswitch-mod-directory freeswitch-mod-distributor freeswitch-mod-easyroute freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-json-cdr freeswitch-mod-local-stream freeswitch-mod-logfile freeswitch-mod-loopback freeswitch-mod-commands freeswitch-mod-conference freeswitch-mod-dptools freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-db freeswitch-mod-dialplan-xml freeswitch-mod-dingaling freeswitch-mod-directory freeswitch-mod-distributor freeswitch-mod-easyroute freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-json-cdr freeswitch-mod-local-stream freeswitch-mod-logfile freeswitch-mod-loopback freeswitch-mod-lua freeswitch-mod-nibblebill freeswitch-mod-odbc-cdr freeswitch-mod-oreka freeswitch-mod-perl freeswitch-mod-python freeswitch-mod-random freeswitch-mod-redis freeswitch-mod-rss freeswitch-mod-say-it freeswitch-mod-sndfile freeswitch-mod-snmp freeswitch-mod-sonar freeswitch-mod-soundtouch freeswitch-mod-spandsp freeswitch-mod-spy freeswitch-mod-stress freeswitch-mod-translate freeswitch-mod-valet-parking freeswitch-mod-vmd freeswitch-mod-voicemail freeswitch-mod-voicemail-ivr freeswitch-mod-xml-cdr freeswitch-mod-xml-curl freeswitch-mod-xml-rpc freeswitch-mod-xml-scgi freeswitch-mod-yaml freeswitch-mod-yuv freeswitch-mod-conference freeswitch-mod-dptools freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-db freeswitch-mod-dialplan-xml freeswitch-mod-dingaling freeswitch-mod-directory freeswitch-mod-distributor freeswitch-mod-easyroute freeswitch-mod-enum freeswitch-mod-esf freeswitch-mod-expr freeswitch-mod-fifo freeswitch-mod-fsv freeswitch-mod-hash freeswitch-mod-httapi freeswitch-mod-json-cdr freeswitch-mod-local-stream freeswitch-mod-logfile freeswitch-mod-loopback freeswitch-mod-lua freeswitch-mod-nibblebill freeswitch-mod-odbc-cdr freeswitch-mod-oreka freeswitch-mod-perl freeswitch-mod-python freeswitch-mod-random freeswitch-mod-redis freeswitch-mod-rss freeswitch-mod-say-it freeswitch-mod-sndfile freeswitch-mod-snmp freeswitch-mod-sonar freeswitch-mod-soundtouch freeswitch-mod-spandsp freeswitch-mod-spy freeswitch-mod-stress freeswitch-mod-translate freeswitch-mod-valet-parking freeswitch-mod-vmd freeswitch-mod-voicemail freeswitch-mod-voicemail-ivr freeswitch-mod-xml-cdr freeswitch-mod-xml-curl freeswitch-mod-xml-rpc freeswitch-mod-xml-scgi freeswitch-mod-yaml freeswitch-mod-yuv

# Install additional FreeSWITCH modules
sudo apt install -y \
    freeswitch-mod-av \
    freeswitch-mod-avmd \
    freeswitch-mod-b64 \
    freeswitch-mod-basic \
    freeswitch-mod-broadcast \
    freeswitch-mod-callcenter \
    freeswitch-mod-cdr-csv \
    freeswitch-mod-cdr-mongodb \
    freeswitch-mod-cdr-pg-csv \
    freeswitch-mod-cdr-sqlite \
    freeswitch-mod-cidlookup \
    freeswitch-mod-commands \
    freeswitch-mod-conference \
    freeswitch-mod-curl \
    freeswitch-mod-db \
    freeswitch-mod-dialplan-asterisk \
    freeswitch-mod-dialplan-xml \
    freeswitch-mod-directory \
    freeswitch-mod-distributor \
    freeswitch-mod-dptools \
    freeswitch-mod-easyroute \
    freeswitch-mod-enum \
    freeswitch-mod-esf \
    freeswitch-mod-esl \
    freeswitch-mod-expr \
    freeswitch-mod-fifo \
    freeswitch-mod-format-cdr \
    freeswitch-mod-fsv \
    freeswitch-mod-hash \
    freeswitch-mod-httapi \
    freeswitch-mod-http-cache \
    freeswitch-mod-json-cdr \
    freeswitch-mod-local-stream \
    freeswitch-mod-logfile \
    freeswitch-mod-loopback \
    freeswitch-mod-lua \
    freeswitch-mod-memcache \
    freeswitch-mod-nibblebill \
    freeswitch-mod-odbc-cdr \
    freeswitch-mod-oreka \
    freeswitch-mod-perl \
    freeswitch-mod-python \
    freeswitch-mod-random \
    freeswitch-mod-redis \
    freeswitch-mod-rss \
    freeswitch-mod-say-it \
    freeswitch-mod-sndfile \
    freeswitch-mod-snmp \
    freeswitch-mod-sonar \
    freeswitch-mod-soundtouch \
    freeswitch-mod-spandsp \
    freeswitch-mod-spy \
    freeswitch-mod-stress \
    freeswitch-mod-translate \
    freeswitch-mod-valet-parking \
    freeswitch-mod-vmd \
    freeswitch-mod-voicemail \
    freeswitch-mod-voicemail-ivr \
    freeswitch-mod-xml-cdr \
    freeswitch-mod-xml-curl \
    freeswitch-mod-xml-rpc \
    freeswitch-mod-xml-scgi \
    freeswitch-mod-yaml \
    freeswitch-mod-yuv

# Create FreeSWITCH directories
sudo mkdir -p /var/lib/freeswitch/recordings
sudo mkdir -p /var/lib/freeswitch/storage
sudo mkdir -p /var/lib/freeswitch/db
sudo mkdir -p /var/log/freeswitch

# Set permissions
sudo chown -R freeswitch:freeswitch /var/lib/freeswitch
sudo chown -R freeswitch:freeswitch /var/log/freeswitch
sudo chown -R freeswitch:freeswitch /etc/freeswitch

# Enable and start FreeSWITCH
sudo systemctl enable freeswitch
sudo systemctl start freeswitch

# Check status
echo "✅ FreeSWITCH installation completed!"
echo "📊 FreeSWITCH Status:"
sudo systemctl status freeswitch --no-pager

echo ""
echo "🔧 Configuration files location:"
echo "   - Main config: /etc/freeswitch"
echo "   - Logs: /var/log/freeswitch"
echo "   - Recordings: /var/lib/freeswitch/recordings"
echo ""
echo "🌐 Event Socket Library (ESL) available on:"
echo "   - Host: localhost"
echo "   - Port: 8021"
echo "   - Password: ClueCon"
echo ""
echo "📞 SIP Profile available on:"
echo "   - Internal: 5060"
echo "   - External: 5080"
echo ""
echo "🚀 FreeSWITCH is ready for W3 VoIP System!"

