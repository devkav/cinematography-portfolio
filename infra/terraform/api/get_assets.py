import json
#import logging

#logger = logging.getLogger()
#logger.setLevel(logging.INFO)

def handler(event, context):
    length = int(event['queryStringParameters']['length'])
    width = int(event['queryStringParameters']['width'])
    
    area = calculate_area(length, width)
    print(f"The area is {area}")
        
    #logger.info(f"CloudWatch logs group: {context.log_group_name}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': {
            'area': area
        }
    }
    
def calculate_area(length, width):
    return length * width
