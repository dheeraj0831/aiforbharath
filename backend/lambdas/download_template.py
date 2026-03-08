import json
import boto3
import os

def lambda_handler(event, context):
    try:
        s3 = boto3.client('s3')
        # Generating a presigned URL to download 'sales_template.xlsx'
        bucket_name = 'aiforbharath-templates'
        object_name = 'sales_template.xlsx'
        
        presigned_url = s3.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_name},
                                                    ExpiresIn=3600)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*', # Required for CORS support to work
                'Access-Control-Allow-Credentials': True # Required for cookies, authorization headers with HTTPS
            },
            'body': json.dumps({
                'downloadUrl': presigned_url
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
