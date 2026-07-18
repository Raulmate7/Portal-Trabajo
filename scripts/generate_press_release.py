import os
import logging
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Placeholder DB query – in production replace with actual DB access
def fetch_exclusive_data():
    """Return a dict with dummy exclusive data for press releases."""
    # Simulated data – salaries, trends, top tech stats
    return {
        "date": datetime.utcnow().strftime('%Y-%m-%d'),
        "top_technologies": ["Python", "React", "Node.js"],
        "average_salary": 45000,
        "salary_growth": 5.2,  # percent
        "remote_percentage": 38,
        "insights": "La demanda de desarrolladores Python ha crecido un 12% respecto al trimestre anterior."
    }

def render_markdown(data, template_path):
    with open(template_path, 'r') as f:
        template = f.read()
    # Simple placeholder replacement
    rendered = template.replace('{{date}}', data['date'])
    rendered = rendered.replace('{{top_technologies}}', ', '.join(data['top_technologies']))
    rendered = rendered.replace('{{average_salary}}', f"{data['average_salary']} €")
    rendered = rendered.replace('{{salary_growth}}', f"{data['salary_growth']}%")
    rendered = rendered.replace('{{remote_percentage}}', f"{data['remote_percentage']}%")
    rendered = rendered.replace('{{insights}}', data['insights'])
    return rendered

def generate_press_release():
    data = fetch_exclusive_data()
    template_path = os.path.join(os.path.dirname(__file__), '..', 'press_releases', 'template.md')
    if not os.path.isfile(template_path):
        logger.error('Press release template not found')
        return
    markdown = render_markdown(data, template_path)
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'press_releases'))
    os.makedirs(output_dir, exist_ok=True)
    filename = f"press_release_{data['date']}.md"
    output_path = os.path.join(output_dir, filename)
    with open(output_path, 'w') as f:
        f.write(markdown)
    logger.info(f'Press release generated: {output_path}')

if __name__ == '__main__':
    generate_press_release()
