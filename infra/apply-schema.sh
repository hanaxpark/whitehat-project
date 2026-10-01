#!/usr/bin/env bash
# users-service task definition(시크릿/SG/서브넷 포함)을 재사용하는 일회성 태스크로 SQL 파일을 whs-db에 실행한다.
# 사용법: bash infra/apply-schema.sh [SQL파일]   (기본 db/schema.sql, IF NOT EXISTS뿐이라 반복 실행해도 안전)
# DB가 프라이빗이라 로컬에서는 접속할 수 없다.
set -euo pipefail
cd "$(dirname "$0")/.."
SQL_FILE=${1:-db/schema.sql}
R=us-west-2

SG=$(aws ec2 describe-security-groups --region $R --filters Name=group-name,Values=blueteam-ecs-task-sg \
  --query 'SecurityGroups[0].GroupId' --output text)
SUBNET=$(aws ec2 describe-subnets --region $R --filters Name=tag:Name,Values=whs-private-webapp \
  --query 'Subnets[0].SubnetId' --output text)

JS="const m=require('mysql2/promise');(async()=>{
const c=await m.createConnection({host:process.env.DB_HOST,port:3306,user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
const [r]=await c.query(Buffer.from(process.env.SCHEMA_B64,'base64').toString());
console.log('RESULT',JSON.stringify(r));await c.end()})().catch(e=>{console.error('FAILED',e.message);process.exit(1)})"

OVERRIDES=$(jq -nc --arg js "$JS" --arg sql "$(base64 -w0 "$SQL_FILE")" \
  '{containerOverrides:[{name:"users",command:["node","-e",$js],environment:[{name:"SCHEMA_B64",value:$sql}]}]}')

TASK=$(aws ecs run-task --region $R --cluster blueteam --launch-type FARGATE --task-definition users-service \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --overrides "$OVERRIDES" --query 'tasks[0].taskArn' --output text)
echo "started $TASK"

aws ecs wait tasks-stopped --region $R --cluster blueteam --tasks "$TASK"
aws ecs describe-tasks --region $R --cluster blueteam --tasks "$TASK" \
  --query 'tasks[0].{exit:containers[0].exitCode,reason:stoppedReason}'
sleep 5
aws logs tail /ecs/users-service --region $R --since 10m --filter-pattern '?RESULT ?FAILED'
