#!/bin/bash
aws s3 cp --recursive s3://dkavalchek-terraform/ .
chmod +x ./*.sh
