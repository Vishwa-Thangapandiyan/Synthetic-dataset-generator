"""
Test script for Synthetic Dataset Generator
Run this to verify the setup and see example outputs
"""

from synthetic_dataset_generator import SyntheticDatasetGenerator
import json

def test_generation():
    """Test the dataset generator with sample prompts"""
    
    print("="*70)
    print("SYNTHETIC DATASET GENERATOR - TEST SCRIPT")
    print("="*70)
    print()
    
    # Initialize generator
    print("Step 1: Initializing Llama 3.1 model...")
    print("(This may take a few minutes on first run)")
    print()
    
    try:
        generator = SyntheticDatasetGenerator()
        print("✓ Model loaded successfully!")
        print()
    except Exception as e:
        print(f"✗ Error loading model: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Ensure you've run: huggingface-cli login")
        print("2. Request access to Llama 3.1 at: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct")
        print("3. Check your internet connection")
        return
    
    # Test cases for each domain
    test_cases = [
        {
            "name": "Airline - Flight Delays",
            "domain": "airline",
            "prompt": "Generate 3 customer service conversations about flight delays with rebooking requests",
            "num_samples": 3
        },
        {
            "name": "E-Commerce - Product Reviews",
            "domain": "ecommerce",
            "prompt": "Generate 3 product reviews for wireless headphones with star ratings and customer feedback",
            "num_samples": 3
        },
        {
            "name": "Social Media - User Posts",
            "domain": "social_media",
            "prompt": "Generate 3 social media posts about sustainable living with likes and comments count",
            "num_samples": 3
        },
        {
            "name": "Healthcare - Appointments",
            "domain": "healthcare",
            "prompt": "Generate 3 patient appointment scheduling requests with preferred dates and symptoms",
            "num_samples": 3
        }
    ]
    
    results = []
    
    for idx, test_case in enumerate(test_cases, 1):
        print("="*70)
        print(f"Test {idx}/{len(test_cases)}: {test_case['name']}")
        print("="*70)
        print(f"Domain: {test_case['domain']}")
        print(f"Prompt: {test_case['prompt']}")
        print()
        print("Generating... (this may take 30-60 seconds)")
        print()
        
        try:
            result = generator.generate_dataset(
                user_prompt=test_case['prompt'],
                domain=test_case['domain'],
                num_samples=test_case['num_samples'],
                temperature=0.8,
                max_length=1024
            )
            
            # Save result
            output_file = f"/home/claude/test_output_{test_case['domain']}.json"
            generator.save_dataset(result, output_file)
            
            print("✓ Generation successful!")
            print(f"✓ Saved to: {output_file}")
            print()
            print("Preview of generated data:")
            print("-" * 70)
            
            # Pretty print first sample
            if result['dataset']:
                print(json.dumps(result['dataset'][0], indent=2)[:500])
                if len(json.dumps(result['dataset'][0], indent=2)) > 500:
                    print("...")
            else:
                print(result['raw_output'][:500])
                if len(result['raw_output']) > 500:
                    print("...")
            
            print("-" * 70)
            print()
            
            results.append({
                "test": test_case['name'],
                "status": "success",
                "file": output_file
            })
            
        except Exception as e:
            print(f"✗ Error generating dataset: {str(e)}")
            results.append({
                "test": test_case['name'],
                "status": "failed",
                "error": str(e)
            })
        
        print()
    
    # Summary
    print("="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    successful = sum(1 for r in results if r['status'] == 'success')
    failed = sum(1 for r in results if r['status'] == 'failed')
    
    print(f"Total tests: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print()
    
    if successful > 0:
        print("Generated files:")
        for r in results:
            if r['status'] == 'success':
                print(f"  ✓ {r['test']}: {r['file']}")
    
    if failed > 0:
        print()
        print("Failed tests:")
        for r in results:
            if r['status'] == 'failed':
                print(f"  ✗ {r['test']}: {r['error']}")
    
    print()
    print("="*70)
    print("Testing complete!")
    print("="*70)


if __name__ == "__main__":
    test_generation()
