# -*- coding:utf-8 -*-

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from log import logging


mail_host = 'smtp.caoliang.net'
mail_user = 'i@caoliang.net'
mail_pass = '000000'
sender = 'i@caoliang.net'


def send_text_email(receiver, title, content):
    msg = MIMEText(content,'plain','utf-8')

    msg['Subject'] = title
    msg['From'] = sender
    msg['To'] = receiver

    try:
        smtp_obj = smtplib.SMTP()
        smtp_obj.connect(mail_host, 25)
        smtp_obj.login(mail_user, mail_pass)
        smtp_obj.sendmail(sender, receiver, msg.as_string())
        smtp_obj.quit()
        return True
    except smtplib.SMTPException as e:
        logging.error("Cannot send email: %s" % e)
        return False


def send_html_email(receiver, title, content, attach_list=None):
    if not attach_list:
        attach_list = []

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = receiver
    msg['Subject'] = title


    # set html type paramater.
    msg.attach(MIMEText(content,'html','utf-8'))

    for file_path in attach_list:
        with open(file_path, 'rb') as fp:
            attacf_f = MIMEImage(fp.read())

        attacf_f['Content-Type'] = 'application/octet-stream'
        attacf_f['Content-Disposition'] = 'attachment;filename="%s"' % os.path.split(file_path)[1]

        msg.attach(attacf_f)

    try:
        smtp_obj = smtplib.SMTP()
        smtp_obj.connect(mail_host, 25)
        smtp_obj.login(mail_user, mail_pass)
        print "email login succeed ."

        print "send -> ", smtp_obj.sendmail(sender, receiver, msg.as_string())
        smtp_obj.quit()

        return True

    except smtplib.SMTPException as e:
        logging.error("Cannot send email: %s" % e)
        print "Cannot send email: %s" % e
        return False