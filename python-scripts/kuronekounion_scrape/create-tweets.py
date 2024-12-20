import re  # Import regular expressions
import os
import pandas as pd
from datetime import datetime, timedelta

# Step 1: Read the Excel file
cwd = os.getcwd()
excel_file = os.path.join(cwd, 'kuronekounion_combined.xlsx')  # Adjusted the filename to your context
df = pd.read_excel(excel_file)

# Step 2: Explicitly cast 'Like', 'Retweet', and 'Reply' columns to Int64 (which supports NaN)
df['Like'] = pd.to_numeric(df['Like'], errors='coerce').astype('Int64')
df['Retweet'] = pd.to_numeric(df['Retweet'], errors='coerce').astype('Int64')
df['Reply'] = pd.to_numeric(df['Reply'], errors='coerce').astype('Int64')

# Step 3: Replace NaN values with '---' only for non-numeric columns
# Select only non-numeric columns
non_numeric_columns = df.select_dtypes(exclude=['number']).columns
df[non_numeric_columns] = df[non_numeric_columns].fillna('---')

# Step 4: Initialize variables for HTML output and media tracking
html_output = []
tweet_count = 1  # To generate tweet-XXXX class dynamically

# Function to check if a string is in ISO 8601 date format
def is_iso8601(date_string):
    try:
        datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%S.%fZ')
        return True
    except (ValueError, TypeError): 
        return False

# Function to convert ISO 8601 timestamp to JST (Japan Standard Time) format
def format_timestamp(iso_string):
    dt = datetime.strptime(iso_string, '%Y-%m-%dT%H:%M:%S.%fZ')
    dt = dt + timedelta(hours=9)
    return dt.strftime('%I:%M %p&nbsp;·&nbsp;%b&nbsp;%d,&nbsp;%Y&nbsp;JST').lstrip('0')

# Function to format the date into a filename format (YYYYMMDD_HHMMSS)
def format_date_for_filename(date_value):
    try:
        if isinstance(date_value, str):
            parsed_date = pd.to_datetime(date_value, utc=True)
            parsed_date = parsed_date.tz_convert('Asia/Tokyo')
            return parsed_date.strftime('%Y%m%d_%H%M%S')
        else:
            return "unknown_date"
    except Exception as e:
        print(f"Error parsing date: {e}")
        return "unknown_date"

# Updated function to format text in Content column
def format_text(text):
    text = str(text).strip()  
    
    # Wrap 'https' links first to avoid conflicts
    wrapped_text = re.sub(
        r'(https://\S+)',
        r'<span class="pink-link"><a href="twitter-kuronekounion.html">\1</a></span>',
        text
    )
    
    # Handle hashtags
    wrapped_text = re.sub(
        r'(^|\s)(#[a-zA-Z0-9ぁ-んァ-ン一-龯ー々]+)',  
        r'\1<span class="pink-link"><a href="twitter-kuronekounion.html">\2</a></span>',
        wrapped_text
    )

    # Handle mentions with an exception for @kuronekounion
    wrapped_text = re.sub(
        r'(^|\s)(@[a-zA-Z0-9_]+)',  
        lambda match: match.group(0) if match.group(2) == '@kuronekounion' else f'{match.group(1)}<span class="pink-link"><a href="twitter-kuronekounion.html">{match.group(2)}</a></span>',
        wrapped_text
    )

    # Ensure there is no whitespace between two adjacent links
    wrapped_text = re.sub(
        r'(<a href="[^"]+">[^<]+</a>)(\s+)(<a href="[^"]+">[^<]+</a>)',
        r'\1&nbsp;\3',
        wrapped_text
    )
    
    # Replace specific emojis
    wrapped_text = wrapped_text.replace(
        "🐈‍⬛", '<img src="svgs/1f408-200d-2b1b.svg" alt="🐈" style="width: 1em; height: auto; vertical-align: middle;" />'
    )
    
    # Handle 'http' links after 'https' is wrapped, to avoid conflicts
    wrapped_text = re.sub(
        r'(http://\S+)',
        r'<span class="pink-link"><a href="twitter-kuronekounion.html">\1</a></span>',
        wrapped_text
    )
    
    # Replace newlines with <br> tags for HTML formatting
    final_formatted_text = wrapped_text.replace('\n', '<br>')
    
    return final_formatted_text.strip()


# Step 5: Iterate over each row in the DataFrame
for index, row in df.iterrows():
    if isinstance(row['Date'], str) and is_iso8601(row['Date']):
        column_a = format_timestamp(row['Date'])  
        date_filename = format_date_for_filename(row['Date'])  
    else:
        column_a = str(row['Date'])  
        date_filename = "unknown_date"

    # Handle column B (Post Type: image/text handling)
    column_b = ''
    if row['Post Type'] == 'image':
        # Add support for multiple images (comma-separated in 'Image' column)
        images = row['Image'].split(',')
        # Start at _2 for the second image
        image_tags = ''.join([f'<img src="Media/@kuronekounion/{date_filename}{f"_{i+1}" if i > 0 else ""}.jpg" />' for i in range(len(images))])
        column_b = f'<div class="media-content">{image_tags}</div>'
    
    # Format column C (Content text)
    column_c = format_text(row['Content'])
    
    # Extract column Like (likes), Retweet (retweets), Reply (comments) and format them
    column_d = row['Like'] if pd.notna(row['Like']) else '---'
    column_e = row['Retweet'] if pd.notna(row['Retweet']) else '---'
    column_f = row['Reply'] if pd.notna(row['Reply']) else '---'
    
    # Step 6: Construct the tweet-contents HTML
    tweet_contents = f'''
            <span class="tweet-contents">
                <span style="margin-bottom: 2px;"><a href="twitter-kuronekounion.html"><strong>黒ネコ同盟(堀江由衣&スタッフ)</strong></a></span>&nbsp;
                <span style="font-size: 12px; color: #536471; margin-bottom: 2px;">@kuronekounion&nbsp;
                &nbsp;·&nbsp;
                {column_a}</span>
                <br>
                {column_c}
                {column_b}
                <span class="interactions">
                    <span class="comment">
                        <a>
                            <span class="icon-wrapper">
                                <img src="svgs/comment-twitter-icon.svg" alt="💬" style="width: 1em; height: auto; vertical-align: middle;" />
                            </span>
                            &nbsp;{column_f}
                        </a>
                    </span>
                    <span class="retweet">
                        <a>
                            <span class="icon-wrapper">
                                <img src="svgs/Ei-retweet.svg" alt="🔁" style="width: 1em; height: auto; vertical-align: middle;" />
                            </span>
                            &nbsp;{column_e}
                        </a>
                    </span>
                    <span class="like">
                        <a>
                            <span class="icon-wrapper">
                                <img src="svgs/heart.svg" alt="❤" style="width: 1em; height: auto; vertical-align: middle;" />
                            </span>
                            &nbsp;{column_d}
                        </a>
                    </span>
                </span>
            </span>
    '''
    
    # Step 7: Wrap the tweet-contents with the new structure
    full_html_structure = f'''
    <div class="post-contents tweet-{tweet_count:04d}">
        <div class="content-button"><img src="svgs/three-dots.svg" style="width:50%; height:50%;" /></div>
        <a href="twitter-kuronekounion.html">
            <div class="post-profile">
                <img src="Media/@kuronekounion/XvNxwvo4_400x400.jpg" />
            </div>
        </a>
        {tweet_contents.strip()}
    </div>
    '''
    
    # Append the full HTML structure for this row to the output
    html_output.append(full_html_structure.strip())
    tweet_count += 1  # Increment tweet counter

# Step 8: Write the output to an HTML file without extra empty lines
html_file = os.path.join(cwd, 'html-structure.html')
with open(html_file, 'w', encoding='utf-8') as f:
    for html in html_output:
        f.write(html)

print(f"HTML output saved to {html_file}")
