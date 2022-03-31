#!/bin/bash

## 以下、https://github.com/mroonga/docker/releases/tag/mysql5734_mroonga1103のコピペ
original_owner=$(stat --format=%u /var/lib/mysql)
original_group=$(stat --format=%g /var/lib/mysql)

if [ ! -e /var/lib/mysql/ibdata1 ] ; then
  ## If overroded my.cnf is there, rename and restore it.
  ## See https://github.com/mroonga/docker/issues/59
  [ -e /etc/my.cnf ] && mv -n /etc/my.cnf /etc/my.cnf.save
  rm -r /var/lib/mysql/*
  mysqld \
    --no-defaults \
    --initialize-insecure \
    --basedir=/usr \
    --datadir=/var/lib/mysql \
    --user=mysql
  chown -R mysql: /var/lib/mysql
  /usr/sbin/mysqld --user=mysql --daemonize
  mysql -e "CREATE USER root@'%'; GRANT ALL ON *.* TO root@'%' WITH GRANT OPTION"
  mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql mysql
  mysql < /usr/share/mroonga/install.sql

  ## 追記ここから（docker-entrypoint-initdb.dの真似）
  if [ -d /docker-entrypoint-initdb.d ]; then
    for f in /docker-entrypoint-initdb.d/*.sql; do
	    if [[ -f $f ]]; then
        echo $f
	      mysql < $f		
	    fi
	  done
  fi
  ## 追記ここまで

  mysqladmin shutdown
  ### Restore my.cnf
  [[ -e /etc/my.cnf.save ]] && mv /etc/my.cnf.save /etc/my.cnf
  rm /var/lib/mysql/auto.cnf /var/lib/mysql/groonga.log
fi

chown -R mysql: /var/lib/mysql
/usr/sbin/mysqld --user=mysql "$@"

chown -R $original_owner:$original_group /var/lib/mysql
