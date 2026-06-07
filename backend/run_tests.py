import sys
import unittest

def main():
    print("🧪 Iniciando ejecución de tests automatizados en Portal Trabajo IT...")
    print("=====================================================================")
    
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir="tests", pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("=====================================================================")
    if result.wasSuccessful():
        print("✅ ¡Todos los tests pasaron con éxito!")
        sys.exit(0)
    else:
        print("❌ Algunos tests fallaron. Por favor, revisa el registro anterior.")
        sys.exit(1)

if __name__ == "__main__":
    main()
