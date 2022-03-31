FROM groonga/mroonga:mysql5734_mroonga1103

RUN yum -y reinstall glibc-common; \
    localedef -f UTF-8 -i ja_JP ja_JP.UTF-8;

ENV LANG="ja_JP.UTF-8" \
    LANGUAGE="ja_JP:ja" \
    LC_ALL="ja_JP.UTF-8"

RUN mkdir /docker-entrypoint-initdb.d

COPY entrypoint.sh /root/entrypoint.sh
RUN chmod +x /root/entrypoint.sh

ENTRYPOINT ["/root/entrypoint.sh"]